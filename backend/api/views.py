from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Seminar, Attendance, JoinedParticipant, Certificate, Evaluation
from .serializers import SeminarSerializer, AttendanceSerializer, JoinedParticipantSerializer, CertificateSerializer, EvaluationSerializer


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'Backend is running', 'storage': 'SQLite local'})


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def seminars(request, seminar_id=None):
    """Get all seminars, create, update, or delete a seminar (stored in SQLite)"""
    # GET -> list all
    if request.method == 'GET':
        qs = Seminar.objects.all().order_by('date')
        serializer = SeminarSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create
    if request.method == 'POST':
        serializer = SeminarSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # PUT -> update (requires seminar_id)
    if request.method == 'PUT' and seminar_id:
        try:
            seminar = Seminar.objects.get(pk=seminar_id)
        except Seminar.DoesNotExist:
            return Response({'error': 'Seminar not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SeminarSerializer(seminar, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # DELETE -> remove (requires seminar_id)
    if request.method == 'DELETE' and seminar_id:
        try:
            seminar = Seminar.objects.get(pk=seminar_id)
            seminar.delete()
            return Response({'deleted': True}, status=status.HTTP_204_NO_CONTENT)
        except Seminar.DoesNotExist:
            return Response({'error': 'Seminar not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
def attendance(request, seminar_id=None):
    """Get attendance records, create attendance record for a seminar"""
    # GET -> list attendance for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = Attendance.objects.filter(seminar_id=seminar_id).order_by('created_at')
        else:
            qs = Attendance.objects.all().order_by('created_at')
        serializer = AttendanceSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create attendance record
    if request.method == 'POST':
        serializer = AttendanceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def joined_participants(request, seminar_id=None):
    """Get joined participants, create joined participant record"""
    # GET -> list joined participants for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = JoinedParticipant.objects.filter(seminar_id=seminar_id).order_by('joined_at')
        else:
            qs = JoinedParticipant.objects.all().order_by('joined_at')
        serializer = JoinedParticipantSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create joined participant record
    if request.method == 'POST':
        serializer = JoinedParticipantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def evaluations(request, seminar_id=None):
    """Get evaluations, create evaluation record"""
    # GET -> list evaluations for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = Evaluation.objects.filter(seminar_id=seminar_id).order_by('created_at')
        else:
            qs = Evaluation.objects.all().order_by('created_at')
        serializer = EvaluationSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create evaluation record
    if request.method == 'POST':
        serializer = EvaluationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def certificates(request, seminar_id=None):
    """Get certificates, create certificate record"""
    # GET -> list certificates for a seminar
    if request.method == 'GET':
        if seminar_id:
            qs = Certificate.objects.filter(seminar_id=seminar_id).order_by('issued_at')
        else:
            qs = Certificate.objects.all().order_by('issued_at')
        serializer = CertificateSerializer(qs, many=True)
        return Response(serializer.data)

    # POST -> create certificate record
    if request.method == 'POST':
        serializer = CertificateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
