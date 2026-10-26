import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, FlatList, Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from './lib/supabase';
import { enviarNotificacaoNtfy } from './lib/ntfy';

// ---------- Utilitários de data ----------
const pad = (n) => String(n).padStart(2, '0');

// Date -> 'AAAA-MM-DD' (formato do Postgres, usando a data LOCAL do aparelho)
const paraISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Date -> 'DD/MM/AAAA'
const paraBR = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// 'AAAA-MM-DD' (vindo do banco) -> 'DD/MM/AAAA'
const isoParaBR = (iso) => {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

export default function App() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataTermino, setDataTermino] = useState(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Busca as tarefas já cadastradas (mais recentes primeiro)
  const carregarTarefas = async () => {
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar as tarefas.\n' + error.message);
    } else {
      setTarefas(data);
    }
    setCarregando(false);
  };

  useEffect(() => {
    carregarTarefas();
  }, []);

  // Callback do seletor de data
  const aoMudarData = (event, selecionada) => {
    if (Platform.OS === 'android') setMostrarPicker(false); // no Android o picker é um modal
    if (event.type === 'dismissed') return;
    if (selecionada) setDataTermino(selecionada);
  };

  // Cadastra a tarefa no Supabase e dispara o NTFY
  const cadastrarTarefa = async () => {
    const tituloLimpo = titulo.trim();
    const descricaoLimpa = descricao.trim();

    if (!tituloLimpo || !descricaoLimpa) {
      Alert.alert('Atenção', 'Preencha o título e a descrição.');
      return;
    }

    setEnviando(true);
    Keyboard.dismiss();

    // 1) INSERT no Supabase (id e created_at são gerados pelo banco)
    const { data, error } = await supabase
      .from('atividades')
      .insert({
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
        data_termino: paraISO(dataTermino),
      })
      .select()
      .single();

    if (error) {
      setEnviando(false);
      Alert.alert('Erro ao salvar', error.message);
      return;
    }

    // 2) Só chega aqui se o INSERT deu certo -> dispara a notificação
    const notificou = await enviarNotificacaoNtfy({
      titulo: data.titulo,
      dataTerminoBR: isoParaBR(data.data_termino),
    });

    // Atualiza a lista na tela e limpa o formulário
    setTarefas((atual) => [data, ...atual]);
    setTitulo('');
    setDescricao('');
    setDataTermino(new Date());
    setEnviando(false);

    Alert.alert(
      'Sucesso',
      notificou
        ? 'Tarefa salva e notificação enviada!'
        : 'Tarefa salva, mas a notificação NTFY falhou.'
    );
  };

  // Formulário (renderizado como cabeçalho da lista para rolar junto com ela)
  const formulario = (
    <View>
      <Text style={styles.header}>Minhas Tarefas</Text>

      <Text style={styles.label}>Título:</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: Entregar relatório"
        placeholderTextColor="#888"
        value={titulo}
        onChangeText={setTitulo}
        maxLength={100}
      />

      <Text style={styles.label}>Descrição:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descreva a atividade em detalhes..."
        placeholderTextColor="#888"
        value={descricao}
        onChangeText={setDescricao}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Data de término:</Text>
      <TouchableOpacity style={styles.input} onPress={() => setMostrarPicker(true)}>
        <Text style={styles.dateText}>{paraBR(dataTermino)}</Text>
      </TouchableOpacity>

      {mostrarPicker && (
        <DateTimePicker
          value={dataTermino}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={aoMudarData}
        />
      )}

      <TouchableOpacity
        style={[styles.button, enviando && styles.buttonDisabled]}
        onPress={cadastrarTarefa}
        disabled={enviando}
      >
        {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar tarefa</Text>}
      </TouchableOpacity>

      <Text style={styles.subHeader}>Tarefas cadastradas</Text>
      {carregando && <ActivityIndicator style={{ marginTop: 12 }} />}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={formulario}
        ListEmptyComponent={!carregando && <Text style={styles.vazio}>Nenhuma tarefa cadastrada ainda.</Text>}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardDescricao}>{item.descricao}</Text>
            <Text style={styles.cardData}>Término: {isoParaBR(item.data_termino)}</Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  lista: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 16 },
  subHeader: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 28, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827',
  },
  textArea: { height: 100 },
  dateText: { fontSize: 15, color: '#111827' },
  button: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#93C5FD' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: '#2563EB',
  },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  cardDescricao: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  cardData: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 8 },
  vazio: { textAlign: 'center', color: '#6B7280', marginTop: 16 },
});
